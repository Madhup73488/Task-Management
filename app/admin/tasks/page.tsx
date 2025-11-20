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
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/app/components/ui/dialog";
import { sendTaskAssignmentNotification } from '@/lib/brevo/emailService';

interface User {
  id: string;
  full_name: string;
  email: string;
  role: "admin" | "employee";
}

interface Task {
  id: string;
  title: string;
  description: string;
  status: "not_picked" | "in_progress" | "completed";
  priority: "low" | "medium" | "high";
  deadline: string;
  assigned_to: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  users: { full_name: string } | null; // For assigned_to user's name
}

export default function AdminTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // New Task Form State
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [newTaskStatus, setNewTaskStatus] = useState<
    "not_picked" | "in_progress" | "completed"
  >("not_picked");
  const [newTaskPriority, setNewTaskPriority] = useState<
    "low" | "medium" | "high"
  >("medium");
  const [newTaskDeadline, setNewTaskDeadline] = useState("");
  const [newTaskAssignedTo, setNewTaskAssignedTo] = useState("");

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

        // Fetch tasks without join first
        const { data: tasksData, error: tasksError } = await supabase
          .from("tasks")
          .select("*")
          .order("created_at", { ascending: false });

        if (tasksError) {
          console.error("Tasks error:", tasksError);
          throw tasksError;
        }

        // Fetch all users
        const { data: usersData, error: usersError } = await supabase
          .from("users")
          .select("id, full_name");

        if (usersError) {
          console.error("Users error:", usersError);
          throw usersError;
        }

        setUsers(usersData as User[]);

        // Manually join user data with tasks
        const tasksWithUsers = (tasksData || []).map((task) => ({
          ...task,
          users: task.assigned_to
            ? usersData?.find((u) => u.id === task.assigned_to)
            : null,
        }));

        setTasks(tasksWithUsers as Task[]);
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred.");
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [router]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!currentUser) {
      setError("You must be logged in to create tasks.");
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("tasks")
        .insert([
          {
            title: newTaskTitle,
            description: newTaskDescription,
            status: newTaskStatus,
            priority: newTaskPriority,
            deadline: newTaskDeadline || null,
            assigned_to: newTaskAssignedTo || null,
            created_by: currentUser.id,
          },
        ])
        .select();

      if (error) throw error;

      const createdTask = data[0];

      // Add user data to the new task
      const newTaskWithUser = {
        ...createdTask,
        users: newTaskAssignedTo
          ? users.find((u) => u.id === newTaskAssignedTo)
          : null,
      };

      setTasks((prevTasks) => [newTaskWithUser as Task, ...prevTasks]);
      setIsDialogOpen(false);
      setNewTaskTitle("");
      setNewTaskDescription("");
      setNewTaskStatus("not_picked");
      setNewTaskPriority("medium");
      setNewTaskDeadline("");
      
      // Send task assignment notification if assigned to an employee
      if (newTaskAssignedTo && newTaskWithUser.users) {
        const assignedUser = newTaskWithUser.users;
        const taskLink = `${process.env.NEXT_PUBLIC_BASE_URL}/mytasks/${createdTask.id}`;
        await sendTaskAssignmentNotification(
          assignedUser.email,
          assignedUser.full_name,
          createdTask.title,
          taskLink,
          currentUser.full_name // Assigner's name
        );
      }
      setNewTaskAssignedTo("");
    } catch (err: any) {
      setError(err.message || "Failed to create task.");
      console.error("Error creating task:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsEditDialogOpen(true);
  };

  const handleStatusChange = async (taskId: string, newStatus: "not_picked" | "in_progress" | "completed") => {
    try {
      const { error } = await supabase
        .from("tasks")
        .update({ status: newStatus })
        .eq("id", taskId);

      if (error) throw error;

      // Update task in state
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === taskId ? { ...task, status: newStatus } : task
        )
      );
    } catch (err) {
      console.error("Error updating status:", err);
      alert("Failed to update status");
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-300";
      case "in_progress":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "not_picked":
        return "bg-white text-black border-gray-300";
      default:
        return "bg-white text-black border-gray-300";
    }
  };

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;
    
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase
        .from("tasks")
        .update({
          title: editingTask.title,
          description: editingTask.description,
          status: editingTask.status,
          priority: editingTask.priority,
          deadline: editingTask.deadline || null,
          assigned_to: editingTask.assigned_to || null,
        })
        .eq("id", editingTask.id);

      if (error) throw error;

      // Find the original task to compare assigned_to
      const originalTask = tasks.find(task => task.id === editingTask.id);
      const oldAssignedTo = originalTask?.assigned_to;

      // Update the task in state
      const updatedTaskWithUser = {
        ...editingTask,
        users: editingTask.assigned_to
          ? users.find((u) => u.id === editingTask.assigned_to)
          : null,
      };

      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === editingTask.id ? (updatedTaskWithUser as Task) : task
        )
      );

      // Send task assignment notification if assigned_to changed
      if (editingTask.assigned_to && editingTask.assigned_to !== oldAssignedTo && updatedTaskWithUser.users) {
        const assignedUser = updatedTaskWithUser.users;
        const taskLink = `${process.env.NEXT_PUBLIC_BASE_URL}/mytasks/${editingTask.id}`;
        await sendTaskAssignmentNotification(
          assignedUser.email,
          assignedUser.full_name,
          editingTask.title,
          taskLink,
          currentUser.full_name // Assigner's name
        );
      }

      setIsEditDialogOpen(false);
      setEditingTask(null);
    } catch (err: any) {
      setError(err.message || "Failed to update task.");
      console.error("Error updating task:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading tasks...
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
            <CardTitle className="text-2xl font-bold text-gray-900">
              Task Management
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Create and manage tasks for your team
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700 text-white">
                Create New Task
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create New Task</DialogTitle>
                <DialogDescription>
                  Fill in the details below to create a new task.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateTask} className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newTaskDescription}
                    onChange={(e) => setNewTaskDescription(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={newTaskStatus}
                    onValueChange={(
                      value: "not_picked" | "in_progress" | "completed"
                    ) => setNewTaskStatus(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="not_picked">Not Picked</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={newTaskPriority}
                    onValueChange={(value: "low" | "medium" | "high") =>
                      setNewTaskPriority(value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="deadline">Deadline</Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={newTaskDeadline}
                    onChange={(e) => setNewTaskDeadline(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="assignedTo">Assign To</Label>
                  <Select
                    value={newTaskAssignedTo}
                    onValueChange={setNewTaskAssignedTo}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <Button type="submit" disabled={loading}>
                  {loading ? "Creating..." : "Create Task"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          {/* Edit Task Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Edit Task</DialogTitle>
                <DialogDescription>
                  Make changes to the task details.
                </DialogDescription>
              </DialogHeader>
              {editingTask && (
                <form onSubmit={handleUpdateTask} className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-title">Title</Label>
                    <Input
                      id="edit-title"
                      value={editingTask.title}
                      onChange={(e) =>
                        setEditingTask({
                          ...editingTask,
                          title: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-description">Description</Label>
                    <Textarea
                      id="edit-description"
                      value={editingTask.description}
                      onChange={(e) =>
                        setEditingTask({
                          ...editingTask,
                          description: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-status">Status</Label>
                    <Select
                      value={editingTask.status}
                      onValueChange={(
                        value: "not_picked" | "in_progress" | "completed"
                      ) => setEditingTask({ ...editingTask, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="not_picked">Not Picked</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-priority">Priority</Label>
                    <Select
                      value={editingTask.priority}
                      onValueChange={(value: "low" | "medium" | "high") =>
                        setEditingTask({ ...editingTask, priority: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-deadline">Deadline</Label>
                    <Input
                      id="edit-deadline"
                      type="date"
                      value={editingTask.deadline || ""}
                      onChange={(e) =>
                        setEditingTask({
                          ...editingTask,
                          deadline: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-assignedTo">Assign To</Label>
                    <Select
                      value={editingTask.assigned_to || ""}
                      onValueChange={(value) =>
                        setEditingTask({ ...editingTask, assigned_to: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select employee" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {error && <p className="text-red-500 text-sm">{error}</p>}
                  <Button type="submit" disabled={loading}>
                    {loading ? "Updating..." : "Update Task"}
                  </Button>
                </form>
              )}
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Deadline</TableHead>
                <TableHead>Assigned To</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map((task) => (
                <TableRow key={task.id} className="hover:bg-gray-50">
                  <TableCell 
                    className="font-medium text-blue-600 hover:text-blue-800 cursor-pointer"
                    onClick={() => router.push(`/admin/tasks/${task.id}`)}
                  >
                    {task.title}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Select
                      value={task.status}
                      onValueChange={(value: "not_picked" | "in_progress" | "completed") => 
                        handleStatusChange(task.id, value)
                      }
                    >
                      <SelectTrigger 
                        className={`w-[140px] ${getStatusStyle(task.status)}`}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="not_picked">Not Picked</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell 
                    className="cursor-pointer"
                    onClick={() => router.push(`/admin/tasks/${task.id}`)}
                  >
                    {task.priority}
                  </TableCell>
                  <TableCell 
                    className="cursor-pointer"
                    onClick={() => router.push(`/admin/tasks/${task.id}`)}
                  >
                    {task.deadline}
                  </TableCell>
                  <TableCell 
                    className="cursor-pointer"
                    onClick={() => router.push(`/admin/tasks/${task.id}`)}
                  >
                    {task.users?.full_name || "Unassigned"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

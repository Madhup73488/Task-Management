"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { getCurrentUser } from "@/lib/supabase/auth-helpers";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
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
  ArrowLeft,
  Calendar,
  Clock,
  Trash2,
  Save,
  FileText,
} from "lucide-react";

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
}

interface Comment {
  id: string;
  task_id: string;
  user_id: string;
  comment: string;
  created_at: string;
  updated_at: string;
  user: { full_name: string } | null;
}

export default function AdminTaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [task, setTask] = useState<Task | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [assignedUser, setAssignedUser] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>("");

  // Edit form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<string>("");
  const [priority, setPriority] = useState<string>("");
  const [deadline, setDeadline] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [newComment, setNewComment] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = await getCurrentUser();
        if (!user || user.role !== "admin") {
          router.push("/auth/login");
          return;
        }
        setCurrentUserId(user.id);

        // Fetch task
        const { data: taskData, error: taskError } = await supabase
          .from("tasks")
          .select("*")
          .eq("id", params.id)
          .single();

        if (taskError) throw taskError;

        if (taskData) {
          setTask(taskData);
          setTitle(taskData.title);
          setDescription(taskData.description);
          setStatus(taskData.status);
          setPriority(taskData.priority);
          setDeadline(taskData.deadline || "");
          setAssignedTo(taskData.assigned_to || "");

          // Fetch assigned user
          if (taskData.assigned_to) {
            const { data: userData } = await supabase
              .from("users")
              .select("id, full_name, email")
              .eq("id", taskData.assigned_to)
              .single();

            if (userData) {
              setAssignedUser(userData);
            }
          }
        }

        // Fetch all users for reassignment
        const { data: usersData } = await supabase
          .from("users")
          .select("id, full_name, email");

        if (usersData) {
          setUsers(usersData);
        }

        // Fetch comments
        const { data: commentsData } = await supabase
          .from("comments")
          .select("*, user:users(full_name)")
          .eq("task_id", params.id)
          .order("created_at", { ascending: true });

        if (commentsData) {
          setComments(commentsData as Comment[]);
        }
      } catch (err) {
        console.error("Error fetching task:", err);
        router.push("/admin/tasks");
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchData();
    }
  }, [params.id, router]);

  const handleUpdate = async () => {
    if (!task) return;

    setUpdating(true);
    try {
      const { error } = await supabase
        .from("tasks")
        .update({
          title,
          description,
          status,
          priority,
          deadline: deadline || null,
          assigned_to: assignedTo || null,
        })
        .eq("id", task.id);

      if (error) throw error;

      alert("Task updated successfully!");
      setTask({
        ...task,
        title,
        description,
        status: status as Task["status"],
        priority: priority as Task["priority"],
        deadline,
        assigned_to: assignedTo,
      });
    } catch (err) {
      console.error("Error updating task:", err);
      alert("Failed to update task");
    } finally {
      setUpdating(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!task || !newComment.trim()) return;

    setSubmittingComment(true);
    try {
      const user = await getCurrentUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("comments")
        .insert([
          {
            task_id: task.id,
            user_id: user.id,
            comment: newComment.trim(),
          },
        ])
        .select("*, user:users(full_name)")
        .single();

      if (error) throw error;

      setComments([...comments, data as Comment]);
      setNewComment("");
      alert("Comment added successfully!");
    } catch (err) {
      console.error("Error adding comment:", err);
      alert("Failed to add comment");
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDelete = async () => {
    if (!task) return;

    if (!confirm("Are you sure you want to delete this task? This action cannot be undone.")) {
      return;
    }

    setDeleting(true);
    try {
      const { error } = await supabase
        .from("tasks")
        .delete()
        .eq("id", task.id);

      if (error) throw error;

      alert("Task deleted successfully!");
      router.push("/admin/tasks");
    } catch (err) {
      console.error("Error deleting task:", err);
      alert("Failed to delete task");
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading task details...</p>
        </div>
      </div>
    );
  }

  if (!task) {
    return null;
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "in_progress":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "not_picked":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push("/admin/tasks")}
          className="mb-4"
        >
          <ArrowLeft size={16} className="mr-2" />
          Back to Tasks
        </Button>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Task Details</h1>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleting}
          >
            <Trash2 size={16} className="mr-2" />
            {deleting ? "Deleting..." : "Delete Task"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Edit Task Form */}
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg">Edit Task</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={status} onValueChange={setStatus}>
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
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={priority} onValueChange={setPriority}>
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
              </div>

              <div className="grid gap-2">
                <Label htmlFor="deadline">Deadline</Label>
                <Input
                  id="deadline"
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="assignedTo">Assigned To</Label>
                <Select value={assignedTo} onValueChange={setAssignedTo}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.full_name} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={handleUpdate} disabled={updating} className="w-full">
                <Save size={16} className="mr-2" />
                {updating ? "Saving..." : "Save Changes"}
              </Button>
            </CardContent>
          </Card>

          {/* Comments */}
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText size={18} />
                Comments ({comments.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Comments List */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {comments.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No comments yet. Add the first comment!
                  </p>
                ) : (
                  comments.map((comment) => {
                    const isOwnComment = comment.user_id === currentUserId;
                    return (
                      <div
                        key={comment.id}
                        className={`flex ${isOwnComment ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg p-3 border ${
                            isOwnComment
                              ? 'bg-blue-500 text-white border-blue-600'
                              : 'bg-gray-50 text-gray-900 border-gray-200'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              isOwnComment ? 'bg-blue-600' : 'bg-blue-100'
                            }`}>
                              <span className={`text-sm font-medium ${isOwnComment ? 'text-white' : 'text-blue-600'}`}>
                                {isOwnComment ? 'A' : (comment.user?.full_name?.charAt(0) || 'U')}
                              </span>
                            </div>
                            <div>
                              <p className={`text-sm font-medium ${isOwnComment ? 'text-white' : 'text-gray-900'}`}>
                                {isOwnComment ? 'You' : (comment.user?.full_name || "Unknown")}
                              </p>
                              <p className={`text-xs ${isOwnComment ? 'text-blue-100' : 'text-gray-500'}`}>
                                {new Date(comment.created_at).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <p className={`text-sm whitespace-pre-wrap ${isOwnComment ? 'text-white' : 'text-gray-700'}`}>
                            {comment.comment}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Add Comment Form */}
              <div className="border-t pt-4">
                <Textarea
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={3}
                  className="w-full"
                />
                <Button
                  className="mt-3"
                  onClick={handleSubmitComment}
                  disabled={submittingComment || !newComment.trim()}
                >
                  <Save size={16} className="mr-2" />
                  {submittingComment ? "Adding..." : "Add Comment"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Current Details */}
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg">Current Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Priority</label>
                <div className="mt-1">
                  <Badge className={`${getPriorityColor(task.priority)} capitalize`}>
                    {task.priority}
                  </Badge>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Status</label>
                <div className="mt-1">
                  <Badge className={`${getStatusColor(task.status)} capitalize`}>
                    {task.status.replace("_", " ")}
                  </Badge>
                </div>
              </div>

              {assignedUser && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Assigned To</label>
                  <p className="mt-1 text-gray-900">{assignedUser.full_name}</p>
                  <p className="text-xs text-gray-500">{assignedUser.email}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Task Info */}
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg">Task Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Clock size={16} />
                <div>
                  <p className="font-medium">Created</p>
                  <p className="text-xs">
                    {new Date(task.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Clock size={16} />
                <div>
                  <p className="font-medium">Last Updated</p>
                  <p className="text-xs">
                    {new Date(task.updated_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              {task.deadline && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar size={16} />
                  <div>
                    <p className="font-medium">Deadline</p>
                    <p className="text-xs">
                      {new Date(task.deadline).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

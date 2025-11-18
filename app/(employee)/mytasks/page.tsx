"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { getCurrentUser } from "@/lib/supabase/auth-helpers";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { Avatar, AvatarFallback } from "@/app/components/ui/avatar";
import Link from "next/link";
import {
  Search,
  Filter,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  MoreVertical,
  Eye,
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
  creator: { full_name: string } | null;
}

export default function MyTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [darkMode, setDarkMode] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkDarkMode = () => {
      setDarkMode(document.documentElement.classList.contains('dark'));
    };
    checkDarkMode();
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = await getCurrentUser();
        if (!user) {
          router.push("/auth/login");
          return;
        }

        const { data, error } = await supabase
          .from("tasks")
          .select(`*, creator:users!created_by(full_name)`)
          .eq("assigned_to", user.id);

        if (error) throw error;
        setTasks(data as Task[]);
      } catch (err: any) {
        const errorMessage =
          err.message || JSON.stringify(err) || "An unexpected error occurred.";
        setError(errorMessage);
        console.error("Error fetching tasks:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [router]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "destructive";
      case "medium":
        return "default";
      case "low":
        return "secondary";
      default:
        return "secondary";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "in_progress":
        return <Clock className="h-4 w-4 text-blue-600" />;
      case "not_picked":
        return <AlertCircle className="h-4 w-4 text-amber-600" />;
      default:
        return <XCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-600 bg-green-50 border-green-200";
      case "in_progress":
        return "text-blue-600 bg-blue-50 border-blue-200";
      case "not_picked":
        return "text-amber-600 bg-amber-50 border-amber-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      filterStatus === "all" || task.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const tasksByStatus = {
    not_picked: filteredTasks.filter((t) => t.status === "not_picked"),
    in_progress: filteredTasks.filter((t) => t.status === "in_progress"),
    completed: filteredTasks.filter((t) => t.status === "completed"),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className={`animate-spin rounded-full h-12 w-12 border-b-2 mx-auto ${darkMode ? 'border-white' : 'border-gray-900'}`}></div>
          <p className={`mt-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Loading your tasks...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className={`max-w-md ${darkMode ? 'bg-black border-red-900' : 'border-red-200'}`}>
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 ${darkMode ? 'text-red-400' : 'text-red-600'}`}>
              <XCircle className="h-5 w-5" />
              Error Loading Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={darkMode ? 'text-red-400' : 'text-red-600'}>{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusStyle = (status: string) => {
    if (darkMode) {
      switch (status) {
        case "completed":
          return "bg-green-900 text-green-200 border-green-800";
        case "in_progress":
          return "bg-blue-900 text-blue-200 border-blue-800";
        case "not_picked":
          return "bg-gray-800 text-white border-gray-700";
        default:
          return "bg-gray-800 text-white border-gray-700";
      }
    } else {
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
    }
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

  return (
    <div className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>My Tasks</h1>
            <p className={`mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Manage and track your assigned tasks
            </p>
          </div>
          <Badge
            variant="secondary"
            className={`text-sm px-3 py-1 ${darkMode ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-900'}`}
          >
            {tasks.length} Total
          </Badge>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className={`shadow-sm ${darkMode ? 'bg-black border-gray-800' : 'bg-white border-gray-200'}`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Not Started
                  </p>
                  <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {tasksByStatus.not_picked.length}
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${darkMode ? 'bg-amber-900' : 'bg-amber-100'}`}>
                  <AlertCircle className={`h-6 w-6 ${darkMode ? 'text-amber-400' : 'text-amber-600'}`} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={`shadow-sm ${darkMode ? 'bg-black border-gray-800' : 'bg-white border-gray-200'}`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    In Progress
                  </p>
                  <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {tasksByStatus.in_progress.length}
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${darkMode ? 'bg-blue-900' : 'bg-blue-100'}`}>
                  <Clock className={`h-6 w-6 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={`shadow-sm ${darkMode ? 'bg-black border-gray-800' : 'bg-white border-gray-200'}`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Completed</p>
                  <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {tasksByStatus.completed.length}
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${darkMode ? 'bg-green-900' : 'bg-green-100'}`}>
                  <CheckCircle2 className={`h-6 w-6 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <Card className={`shadow-sm ${darkMode ? 'bg-black border-gray-800' : 'bg-white border-gray-200'}`}>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                <Input
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`pl-10 ${darkMode ? 'bg-gray-900 border-gray-800 text-white placeholder:text-gray-500' : ''}`}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={filterStatus === "all" ? "default" : "outline"}
                  onClick={() => setFilterStatus("all")}
                  className={`gap-1 ${darkMode && filterStatus !== "all" ? 'text-gray-300 border-gray-700 hover:bg-gray-800' : ''}`}
                >
                  <Filter className="h-4 w-4" />
                  All
                </Button>
                <Button
                  variant={
                    filterStatus === "not_picked" ? "default" : "outline"
                  }
                  onClick={() => setFilterStatus("not_picked")}
                  className={darkMode && filterStatus !== "not_picked" ? 'text-gray-300 border-gray-700 hover:bg-gray-800' : ''}
                >
                  Not Started
                </Button>
                <Button
                  variant={
                    filterStatus === "in_progress" ? "default" : "outline"
                  }
                  onClick={() => setFilterStatus("in_progress")}
                  className={darkMode && filterStatus !== "in_progress" ? 'text-gray-300 border-gray-700 hover:bg-gray-800' : ''}
                >
                  In Progress
                </Button>
                <Button
                  variant={filterStatus === "completed" ? "default" : "outline"}
                  onClick={() => setFilterStatus("completed")}
                  className={darkMode && filterStatus !== "completed" ? 'text-gray-300 border-gray-700 hover:bg-gray-800' : ''}
                >
                  Completed
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tasks Table */}
        <Card className={`shadow-sm ${darkMode ? 'bg-black border-gray-800' : 'border-gray-200'}`}>
          <CardHeader>
            <CardTitle className={darkMode ? 'text-white' : ''}>All Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredTasks.length === 0 ? (
              <div className="p-12 text-center">
                <AlertCircle className={`h-12 w-12 mx-auto mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                <h3 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  No tasks found
                </h3>
                <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                  You don't have any tasks assigned yet.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className={darkMode ? 'border-gray-800' : 'border-b'}>
                      <th className={`text-left p-3 font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Title</th>
                      <th className={`text-left p-3 font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Status</th>
                      <th className={`text-left p-3 font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Priority</th>
                      <th className={`text-left p-3 font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Deadline</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTasks.map((task) => (
                      <tr key={task.id} className={`${darkMode ? 'border-gray-800 hover:bg-gray-800' : 'border-b hover:bg-gray-50'}`}>
                        <td 
                          className={`p-3 font-medium cursor-pointer ${
                            darkMode 
                              ? 'text-blue-400 hover:text-blue-300' 
                              : 'text-blue-600 hover:text-blue-800'
                          }`}
                          onClick={() => router.push(`/mytasks/${task.id}`)}
                        >
                          {task.title}
                        </td>
                        <td className="p-3" onClick={(e) => e.stopPropagation()}>
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
                        </td>
                        <td 
                          className="p-3 cursor-pointer capitalize"
                          onClick={() => router.push(`/mytasks/${task.id}`)}
                        >
                          <Badge variant={getPriorityColor(task.priority)}>
                            {task.priority}
                          </Badge>
                        </td>
                        <td 
                          className={`p-3 cursor-pointer ${darkMode ? 'text-gray-300' : ''}`}
                          onClick={() => router.push(`/mytasks/${task.id}`)}
                        >
                          {new Date(task.deadline).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

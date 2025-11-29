"use client";

import { useEffect, useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Input } from "@/app/components/ui/input";
import {
  Download,
  Calendar,
  Users,
  ListTodo,
  CheckCircle2,
  UserPlus,
  Search,
  Filter,
  Clock,
  AlertCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeTasks: 0,
    completedToday: 0,
    pendingInvites: 0,
  });
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [recentTasks, setRecentTasks] = useState<any[]>([]);
  const [tasksByStatus, setTasksByStatus] = useState({
    completed: 0,
    inProgress: 0,
    notPicked: 0,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

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

  // Read search query from URL only on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlSearch = params.get("search") || "";
    setSearchQuery(urlSearch);
  }, []);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const { supabase } = await import("@/lib/supabase/client");

        // Fetch all users
        const { data: users, error: usersError } = await supabase
          .from("users")
          .select("*")
          .order("created_at", { ascending: false });

        if (usersError) throw usersError;

        // Fetch all tasks with assigned user info
        const { data: tasks, error: tasksError } = await supabase
          .from("tasks")
          .select(`
            *,
            assigned_user:users!assigned_to(full_name, email),
            creator:users!created_by(full_name)
          `)
          .order("created_at", { ascending: false });

        if (tasksError) throw tasksError;

        // Set recent tasks (last 10)
        setRecentTasks(tasks?.slice(0, 10) || []);

        // Calculate stats
        const totalUsers = users?.length || 0;
        const activeTasks = tasks?.filter((t: any) => t.status !== "completed").length || 0;
        
        // Completed today (last 24 hours)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const completedToday = tasks?.filter((t: any) => {
          if (t.status === "completed" && t.updated_at) {
            const updatedDate = new Date(t.updated_at);
            return updatedDate >= today;
          }
          return false;
        }).length || 0;

        // Pending invites (users with invited status)
        const pendingInvites = users?.filter((u: any) => u.status === "invited").length || 0;

        setStats({
          totalUsers,
          activeTasks,
          completedToday,
          pendingInvites,
        });

        // Set recent users (last 5)
        setRecentUsers(users?.slice(0, 5) || []);

        // Calculate task distribution
        const completed = tasks?.filter((t: any) => t.status === "completed").length || 0;
        const inProgress = tasks?.filter((t: any) => t.status === "in_progress").length || 0;
        const notPicked = tasks?.filter((t: any) => t.status === "not_picked").length || 0;

        setTasksByStatus({ completed, inProgress, notPicked });
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Admin stats
  const adminStats = [
    { label: "Total Users", value: stats.totalUsers.toString(), icon: <Users size={20} />, color: "bg-blue-500", change: "+12%" },
    { label: "Active Tasks", value: stats.activeTasks.toString(), icon: <ListTodo size={20} />, color: "bg-purple-500", change: "+8%" },
    { label: "Completed Today", value: stats.completedToday.toString(), icon: <CheckCircle2 size={20} />, color: "bg-green-500", change: "+15%" },
    { label: "Pending Invites", value: stats.pendingInvites.toString(), icon: <UserPlus size={20} />, color: "bg-yellow-500", change: "-2" },
  ];

  // Task overview by status
  const tasksStatusArray = [
    { status: "Completed", count: tasksByStatus.completed, color: "bg-green-500" },
    { status: "In Progress", count: tasksByStatus.inProgress, color: "bg-blue-500" },
    { status: "Not Picked", count: tasksByStatus.notPicked, color: "bg-gray-400" },
  ];

  const totalTasks = tasksByStatus.completed + tasksByStatus.inProgress + tasksByStatus.notPicked;

  return (
    <div className="p-3 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 md:gap-4 mb-4 md:mb-6">
        <div>
          <h1 className={`text-xl md:text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Admin Dashboard</h1>
          <p className={`text-xs md:text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>Welcome back, Admin!</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <div className={`flex items-center justify-center gap-2 px-3 py-2 ${darkMode ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-200'} border rounded-lg text-xs md:text-sm`}>
            <Calendar size={16} className={darkMode ? 'text-gray-400' : 'text-gray-500'} />
            <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>This Month</span>
          </div>
          <Button className="bg-gray-900 text-white hover:bg-gray-800 text-sm w-full sm:w-auto dark:bg-white dark:text-black dark:hover:bg-gray-100">
            <Download size={16} className="mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-4 md:mb-6">
        {adminStats.map((stat, idx) => (
          <Card key={idx} className={`${darkMode ? 'bg-black border-gray-800' : 'bg-white border-gray-200'} hover:shadow-md transition-shadow`}>
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className={`text-xs md:text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-1`}>{stat.label}</p>
                  <p className={`text-2xl md:text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>{stat.value}</p>
                  <div className="flex items-center gap-1">
                    <span className={`text-xs font-semibold ${stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                      {stat.change}
                    </span>
                    <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>vs last month</span>
                  </div>
                </div>
                <div className={`p-4 rounded-xl ${stat.color} ${stat.color.replace('bg-', 'bg-opacity-10 bg-')}`}>
                  <div className={stat.color.replace('bg-', 'text-')}>{stat.icon}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-4 md:mb-6">
        {/* System Activity */}
        <Card className={`${darkMode ? 'bg-black border-gray-800' : 'bg-white border-gray-200'} lg:col-span-2`}>
          <CardHeader className="p-4 md:p-6">
            <CardTitle className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              System Activity
            </CardTitle>
            <CardDescription className={`text-xs ${darkMode ? 'text-gray-400' : ''}`}>
              Task completion and user activity over the last 30 days
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            <div className="h-40 md:h-48 relative overflow-x-auto">
              <svg className="w-full h-full" viewBox="0 0 700 200">
                {/* Grid lines */}
                <line x1="0" y1="0" x2="700" y2="0" stroke="#e5e7eb" strokeWidth="1" />
                <line x1="0" y1="50" x2="700" y2="50" stroke="#e5e7eb" strokeWidth="1" />
                <line x1="0" y1="100" x2="700" y2="100" stroke="#e5e7eb" strokeWidth="1" />
                <line x1="0" y1="150" x2="700" y2="150" stroke="#e5e7eb" strokeWidth="1" />
                <line x1="0" y1="200" x2="700" y2="200" stroke="#e5e7eb" strokeWidth="1" />
                
                {/* Tasks line */}
                <polyline
                  fill="none"
                  stroke="#8b5cf6"
                  strokeWidth="3"
                  points="0,140 100,120 200,100 300,85 400,95 500,70 600,60 700,50"
                />
                
                {/* Users line */}
                <polyline
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="3"
                  points="0,160 100,150 200,130 300,120 400,110 500,100 600,90 700,80"
                />
                
                {/* Data points */}
                {[350, 600].map((x, i) => {
                  const y = i === 0 ? 85 : 60;
                  const color = i === 0 ? "#8b5cf6" : "#8b5cf6";
                  return (
                    <circle key={i} cx={x} cy={y} r="4" fill={color} />
                  );
                })}
              </svg>
              <div className="flex flex-wrap items-center gap-3 md:gap-6 mt-4 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                  <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Tasks Completed</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Active Users</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Task Status Distribution */}
        <Card className={`${darkMode ? 'bg-black border-gray-800' : 'bg-white border-gray-200'}`}>
          <CardHeader className="p-4 md:p-6">
            <CardTitle className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Task Status
            </CardTitle>
            <CardDescription className={`text-xs ${darkMode ? 'text-gray-400' : ''}`}>
              Current task distribution
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            <div className="space-y-3 md:space-y-4">
              {tasksStatusArray.map((item, idx) => (
                <div key={idx}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs md:text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{item.status}</span>
                    <span className={`text-xs md:text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{item.count} tasks</span>
                  </div>
                  <div className={`w-full ${darkMode ? 'bg-gray-800' : 'bg-gray-100'} rounded-full h-2`}>
                    <div 
                      className={`${item.color} h-2 rounded-full`} 
                      style={{ width: `${totalTasks > 0 ? (item.count / totalTasks) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Tasks with Search */}
      <Card className={`${darkMode ? 'bg-black border-gray-800' : 'bg-white border-gray-200'} mb-4 md:mb-6`}>
        <CardHeader className="p-4 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div>
              <CardTitle className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Task Management
              </CardTitle>
              <CardDescription className={`text-xs ${darkMode ? 'text-gray-400' : ''}`}>
                Search and manage all tasks in the system
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => router.push("/admin/tasks")} className="w-full sm:w-auto text-xs">
              View All Tasks
            </Button>
          </div>
          
          {/* Search and Filter */}
          <div className="flex flex-col gap-3">
            <div className="relative flex-1">
              <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
              <Input
                placeholder="Search tasks by title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`pl-10 ${darkMode ? 'bg-gray-900 border-gray-800 text-white placeholder:text-gray-500' : ''}`}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={filterStatus === "all" ? "default" : "outline"}
                onClick={() => setFilterStatus("all")}
                size="sm"
                className={`gap-1 ${darkMode && filterStatus !== "all" ? 'text-gray-300 border-gray-700 hover:bg-gray-800' : ''}`}
              >
                <Filter className="h-3 w-3" />
                All
              </Button>
              <Button
                variant={filterStatus === "not_picked" ? "default" : "outline"}
                onClick={() => setFilterStatus("not_picked")}
                size="sm"
                className={darkMode && filterStatus !== "not_picked" ? 'text-gray-300 border-gray-700 hover:bg-gray-800' : ''}
              >
                Not Started
              </Button>
              <Button
                variant={filterStatus === "in_progress" ? "default" : "outline"}
                onClick={() => setFilterStatus("in_progress")}
                size="sm"
                className={darkMode && filterStatus !== "in_progress" ? 'text-gray-300 border-gray-700 hover:bg-gray-800' : ''}
              >
                In Progress
              </Button>
              <Button
                variant={filterStatus === "completed" ? "default" : "outline"}
                onClick={() => setFilterStatus("completed")}
                size="sm"
                className={darkMode && filterStatus !== "completed" ? 'text-gray-300 border-gray-700 hover:bg-gray-800' : ''}
              >
                Completed
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 md:p-6">
          <div className="space-y-2 md:space-y-3">
            {(() => {
              const filteredTasks = recentTasks.filter((task) => {
                const matchesSearch = task.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                     task.description?.toLowerCase().includes(searchQuery.toLowerCase());
                const matchesFilter = filterStatus === "all" || task.status === filterStatus;
                return matchesSearch && matchesFilter;
              });

              if (filteredTasks.length === 0) {
                return (
                  <div className="text-center py-12">
                    <AlertCircle className={`h-12 w-12 mx-auto mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                    <h3 className={`text-sm font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      No tasks found
                    </h3>
                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {searchQuery ? `No tasks match "${searchQuery}"` : "No tasks available"}
                    </p>
                  </div>
                );
              }

              return filteredTasks.map((task) => (
                <div
                  key={task.id}
                  className={`p-3 md:p-4 rounded-lg border transition-colors cursor-pointer ${
                    darkMode 
                      ? 'border-gray-800 hover:bg-gray-900' 
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                  onClick={() => router.push(`/admin/tasks/${task.id}`)}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                    <h3 className={`font-medium text-sm flex-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {task.title}
                    </h3>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={
                          task.priority === "high" 
                            ? "destructive" 
                            : task.priority === "medium"
                            ? "default"
                            : "secondary"
                        }
                        className="text-xs"
                      >
                        {task.priority}
                      </Badge>
                      <Badge 
                        className={`text-xs ${
                          darkMode
                            ? task.status === "completed"
                              ? "bg-green-900 text-green-200"
                              : task.status === "in_progress"
                              ? "bg-blue-900 text-blue-200"
                              : "bg-gray-800 text-gray-300"
                            : task.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : task.status === "in_progress"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {task.status === "not_picked" ? "Not Started" : 
                         task.status === "in_progress" ? "In Progress" : "Completed"}
                      </Badge>
                    </div>
                  </div>
                  
                  <p className={`text-xs line-clamp-2 mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {task.description}
                  </p>
                  
                  <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                    <div className="flex flex-wrap items-center gap-2 md:gap-4">
                      <span className="flex items-center gap-1 truncate">
                        <Users size={12} />
                        {task.assigned_user?.full_name || task.assigned_user?.email || "Unassigned"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        Due: {new Date(task.deadline).toLocaleDateString()}
                      </span>
                    </div>
                    {task.status === "in_progress" && (
                      <span className="flex items-center gap-1 text-blue-600">
                        <Clock size={12} />
                        Active
                      </span>
                    )}
                    {task.status === "completed" && (
                      <span className="flex items-center gap-1 text-green-600">
                        <CheckCircle2 size={12} />
                        Done
                      </span>
                    )}
                  </div>
                </div>
              ));
            })()}
          </div>
        </CardContent>
      </Card>

      {/* Recent Users */}
      <Card className={`${darkMode ? 'bg-black border-gray-800' : 'bg-white border-gray-200'}`}>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 md:p-6">
          <div>
            <CardTitle className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Recent Users
            </CardTitle>
            <CardDescription className={`text-xs ${darkMode ? 'text-gray-400' : ''}`}>
              Recently added and active users in the system
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => router.push("/admin/users")} className="w-full sm:w-auto text-xs">
            View All
          </Button>
        </CardHeader>
        <CardContent className="p-4 md:p-6">
          <div className="space-y-2 md:space-y-3">
            {recentUsers.length === 0 ? (
              <div className={`text-center py-8 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                No users found
              </div>
            ) : (
              recentUsers.map((userItem) => (
                <div
                  key={userItem.id}
                  className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 md:p-4 rounded-lg border ${darkMode ? 'border-gray-800 hover:bg-gray-900' : 'border-gray-200 hover:bg-gray-50'} transition-colors`}
                >
                  <div className="flex items-center gap-3 md:gap-4 flex-1">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white font-semibold text-sm">
                      {userItem.full_name?.charAt(0) || userItem.email?.charAt(0) || "U"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-medium text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>{userItem.full_name || "No Name"}</h3>
                      <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} truncate`}>{userItem.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={`text-xs px-2 py-0.5 border ${darkMode ? 'border-gray-700 bg-gray-800 text-gray-300' : 'border-gray-200 bg-gray-100 text-gray-800'}`}>
                      {userItem.role || "employee"}
                    </Badge>
                    <Badge 
                      className={`text-xs px-2 py-0.5 border ${
                        userItem.status === 'active' 
                          ? darkMode ? 'border-green-800 bg-green-900 text-green-200' : 'border-green-200 bg-green-100 text-green-800'
                          : darkMode ? 'border-yellow-800 bg-yellow-900 text-yellow-200' : 'border-yellow-200 bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {userItem.status || "active"}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="mt-3 md:mt-4 text-center">
            <Button 
              variant="outline" 
              className="w-full text-sm"
              onClick={() => router.push("/admin/users")}
            >
              Manage All Users
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

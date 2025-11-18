"use client";

import { useEffect, useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import {
  Download,
  Calendar,
  Users,
  ListTodo,
  CheckCircle2,
  UserPlus,
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeTasks: 0,
    completedToday: 0,
    pendingInvites: 0,
  });
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [tasksByStatus, setTasksByStatus] = useState({
    completed: 0,
    inProgress: 0,
    notPicked: 0,
  });

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

        // Fetch all tasks
        const { data: tasks, error: tasksError } = await supabase
          .from("tasks")
          .select("*");

        if (tasksError) throw tasksError;

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
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-sm text-gray-600 mt-1">Welcome back, Admin!</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm">
            <Calendar size={16} className="text-gray-500" />
            <span className="text-gray-700">This Month</span>
          </div>
          <Button className="bg-gray-900 text-white hover:bg-gray-800">
            <Download size={16} className="mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {adminStats.map((stat, idx) => (
          <Card key={idx} className="bg-white border-gray-200 hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-500 mb-1">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</p>
                  <div className="flex items-center gap-1">
                    <span className={`text-xs font-semibold ${stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                      {stat.change}
                    </span>
                    <span className="text-xs text-gray-500">vs last month</span>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* System Activity */}
        <Card className="bg-white border-gray-200 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-900">
              System Activity
            </CardTitle>
            <CardDescription className="text-xs">
              Task completion and user activity over the last 30 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-48 relative">
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
              <div className="flex items-center gap-6 mt-4 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                  <span className="text-gray-600">Tasks Completed</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-gray-600">Active Users</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Task Status Distribution */}
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-900">
              Task Status
            </CardTitle>
            <CardDescription className="text-xs">
              Current task distribution
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tasksStatusArray.map((item, idx) => (
                <div key={idx}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">{item.status}</span>
                    <span className="text-sm font-semibold text-gray-900">{item.count} tasks</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
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

      {/* Recent Users */}
      <Card className="bg-white border-gray-200">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-medium text-gray-900">
              Recent Users
            </CardTitle>
            <CardDescription className="text-xs">
              Recently added and active users in the system
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => router.push("/admin/users")}>
            View All
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentUsers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No users found
              </div>
            ) : (
              recentUsers.map((userItem) => (
                <div
                  key={userItem.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white font-semibold">
                      {userItem.full_name?.charAt(0) || userItem.email?.charAt(0) || "U"}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 text-sm">{userItem.full_name || "No Name"}</h3>
                      <p className="text-xs text-gray-500">{userItem.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className="text-xs px-2 py-0.5 border border-gray-200 bg-gray-100 text-gray-800">
                      {userItem.role || "employee"}
                    </Badge>
                    <Badge 
                      className={`text-xs px-2 py-0.5 border ${
                        userItem.status === 'active' 
                          ? 'border-green-200 bg-green-100 text-green-800' 
                          : 'border-yellow-200 bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {userItem.status || "active"}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="mt-4 text-center">
            <Button 
              variant="outline" 
              className="w-full"
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

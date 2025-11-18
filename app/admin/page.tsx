"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/auth-helpers";

export default function AdminPage() {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await getCurrentUser();
        if (!user) {
          router.push("/auth/login");
          return;
        }
        if (user.role !== "admin") {
          router.push("/dashboard");
          return;
        }
        // Redirect to admin dashboard
        router.push("/admin/dashboard");
      } catch (err) {
        console.error("Error checking auth:", err);
        router.push("/auth/login");
      }
    };
    checkAuth();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    </div>
  );
}

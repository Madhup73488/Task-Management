"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { getCurrentUser } from "@/lib/supabase/auth-helpers";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  profile_image: string | null;
}

export default function AccountPage() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkDarkMode = () => {
      setDarkMode(document.documentElement.classList.contains("dark"));
    };
    checkDarkMode();
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const user = await getCurrentUser();
        if (!user) {
          router.push("/auth/login");
          return;
        }

        const { data, error } = await supabase
          .from("users")
          .select("id, full_name, email, profile_image")
          .eq("id", user.id)
          .single();

        if (error) throw error;
        if (data) {
          setUserProfile(data as UserProfile);
          setFullName(data.full_name || "");
          setProfileImageUrl(data.profile_image);
        }
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred.");
        console.error("Error fetching user profile:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUserProfile();
  }, [router]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!userProfile) {
      setError("User profile not loaded.");
      setLoading(false);
      return;
    }

    let newProfileImageUrl = userProfile.profile_image;

    if (profileImage) {
      const fileExt = profileImage.name.split(".").pop();
      const fileName = `${userProfile.id}-${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("profile_images")
        .upload(filePath, profileImage);

      if (uploadError) {
        console.error("Upload error:", uploadError);
        setError("Failed to upload image.");
        setLoading(false);
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from("profile_images")
        .getPublicUrl(filePath);
      newProfileImageUrl = publicUrlData.publicUrl;
    }

    try {
      const { error: updateError } = await supabase
        .from("users")
        .update({ full_name: fullName, profile_image: newProfileImageUrl })
        .eq("id", userProfile.id);

      if (updateError) throw updateError;
      alert("Profile updated successfully!");
      setUserProfile((prev) =>
        prev
          ? { ...prev, full_name: fullName, profile_image: newProfileImageUrl }
          : null
      );
      setProfileImage(null);
      setPreviewUrl(null);
    } catch (err: any) {
      setError(err.message || "Failed to update profile.");
      console.error("Error updating profile:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileImage(file);
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setProfileImage(null);
    setPreviewUrl(null);
    const fileInput = document.getElementById(
      "profileImage"
    ) as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading account details...</p>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return null;
  }

  return (
    <div className="p-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1
          className={`text-3xl font-bold mb-2 ${
            darkMode ? "text-white" : "text-gray-900"
          }`}
        >
          Account Settings
        </h1>
        <p
          className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}
        >
          Manage your profile and account preferences
        </p>
      </div>

      {/* Profile Photo Section - Top */}
      <Card
        className={`shadow-sm mb-6 max-w-4xl mx-auto ${
          darkMode ? "bg-black border-gray-800" : "bg-white border-gray-200"
        }`}
      >
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center">
            {/* Large Round Profile Photo */}
            <div className="relative mb-4">
              {previewUrl || profileImageUrl ? (
                <img
                  src={previewUrl || profileImageUrl || ""}
                  alt="Profile"
                  className="w-32 h-32 rounded-full object-cover border-4 border-gray-200 dark:border-gray-700 shadow-lg"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 border-4 border-gray-200 dark:border-gray-700 shadow-lg flex items-center justify-center text-white text-4xl font-semibold">
                  {userProfile.full_name?.charAt(0)?.toUpperCase() ||
                    userProfile.email?.charAt(0)?.toUpperCase()}
                </div>
              )}

              {/* Camera Icon Button */}
              <button
                type="button"
                onClick={() => document.getElementById("profileImage")?.click()}
                className={`absolute bottom-0 right-0 w-10 h-10 rounded-full shadow-lg flex items-center justify-center transition-colors ${
                  darkMode
                    ? "bg-gray-800 hover:bg-gray-700 border-2 border-gray-700"
                    : "bg-white hover:bg-gray-50 border-2 border-gray-200"
                }`}
              >
                <svg
                  className={`w-5 h-5 ${
                    darkMode ? "text-gray-300" : "text-gray-600"
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </button>
            </div>

            <h2
              className={`text-xl font-semibold mb-1 ${
                darkMode ? "text-white" : "text-gray-900"
              }`}
            >
              {userProfile.full_name || "User"}
            </h2>
            <p
              className={`text-sm mb-4 ${
                darkMode ? "text-gray-400" : "text-gray-600"
              }`}
            >
              {userProfile.email}
            </p>

            <div className="flex gap-2">
              <Input
                id="profileImage"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => document.getElementById("profileImage")?.click()}
                className={
                  darkMode
                    ? "border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
                    : ""
                }
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                  />
                </svg>
                {profileImageUrl || previewUrl
                  ? "Change Photo"
                  : "Upload Photo"}
              </Button>

              {(previewUrl || profileImage) && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleRemovePhoto}
                  className="text-red-600 hover:text-red-700 hover:border-red-300 dark:text-red-400"
                >
                  Cancel
                </Button>
              )}
            </div>

            {previewUrl && (
              <p
                className={`text-xs mt-2 ${
                  darkMode ? "text-blue-400" : "text-blue-600"
                }`}
              >
                New photo selected. Click "Save Changes" below to upload.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Profile Information Form */}
      <Card
        className={`shadow-sm max-w-6xl mx-auto ${
          darkMode ? "bg-black border-gray-800" : "bg-white border-gray-200"
        }`}
      >
        <CardHeader className="space-y-1 pb-4">
          <CardTitle
            className={`text-xl font-semibold ${
              darkMode ? "text-white" : "text-gray-900"
            }`}
          >
            Profile Information
          </CardTitle>
          <CardDescription
            className={`text-sm ${
              darkMode ? "text-gray-400" : "text-gray-600"
            }`}
          >
            Update your personal details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateProfile} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label
                  htmlFor="fullName"
                  className={`text-sm font-medium ${
                    darkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Full Name
                </Label>
                <Input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className={`h-10 ${
                    darkMode ? "bg-gray-900 border-gray-800 text-white" : ""
                  }`}
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className={`text-sm font-medium ${
                    darkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={userProfile.email}
                  disabled
                  className={`h-10 ${
                    darkMode
                      ? "bg-gray-900 border-gray-800 text-gray-500"
                      : "bg-gray-50"
                  }`}
                />
                <p
                  className={`text-xs ${
                    darkMode ? "text-gray-500" : "text-gray-500"
                  }`}
                >
                  Email cannot be changed
                </p>
              </div>
            </div>

            {error && (
              <div
                className={`p-3 rounded-lg border ${
                  darkMode
                    ? "bg-red-900/20 border-red-800 text-red-400"
                    : "bg-red-50 border-red-200 text-red-600"
                }`}
              >
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}

            <div
              className={`flex justify-end pt-4 border-t ${
                darkMode ? "border-gray-800" : "border-gray-200"
              }`}
            >
              <Button type="submit" className="h-10 px-6" disabled={loading}>
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

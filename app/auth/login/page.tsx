"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmail, resendConfirmationEmail, getCurrentUser, sendPasswordResetEmail, USE_MOCK_AUTH } from "@/lib/supabase/auth-helpers";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetMessage, setResetMessage] = useState<string | null>(null); // New state for reset messages
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResetMessage(null); // Clear reset message on login attempt

    try {
      // Use mock sign-in if USE_MOCK_AUTH is true
      if (USE_MOCK_AUTH && email === "mallikam8105@gmail.com" && password === "pass123") {
        console.log("Mock login successful.");
        const user = await getCurrentUser(); // This will return the mock admin user
        if (user && user.role === 'admin') { // Check user.role directly from mock user
          router.push("/admin/dashboard");
        } else {
          setError("Mock login successful, but user is not an admin.");
        }
      } else {
        // Proceed with real Supabase sign-in
        await signInWithEmail(email, password);
        const user = await getCurrentUser(); // Fetch the latest user data after sign-in

        if (user && user.role === 'admin') {
          router.push("/admin/dashboard");
        } else if (user) {
          router.push("/dashboard");
        } else {
          setError("Login successful, but could not retrieve user data. Please try again.");
        }
      }
    } catch (err: any) {
      console.error("Sign-in error:", err); // Log the full error object
      if (err.message === "Email not confirmed") {
        setError("Please check your email to confirm your account before signing in.");
      } else {
        setError(err.message || "An unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    setLoading(true);
    setError(null);
    setResetMessage(null); // Clear reset message on resend attempt
    try {
      await resendConfirmationEmail(email);
      setResetMessage("A new confirmation email has been sent. Please check your inbox."); // Changed to setResetMessage
    } catch (err: any) {
      console.error("Resend confirmation error:", err);
      setError(err.message || "Failed to resend confirmation email.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setLoading(true);
    setError(null);
    setResetMessage(null);
    try {
      await sendPasswordResetEmail(email);
      setResetMessage("Password reset email sent. Please check your inbox.");
    } catch (err: any) {
      console.error("Forgot password error:", err);
      setError(err.message || "Failed to send password reset email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <Card className="w-[350px]">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-semibold tracking-tight">Sign in</CardTitle>
          <CardDescription className="text-sm leading-none text-muted-foreground">
            Enter your credentials to access your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                {/* Temporarily disable Forgot password? link when using mock auth */}
                {!USE_MOCK_AUTH && (
                  <Button
                    type="button"
                    variant="link"
                    className="px-0 text-xs text-muted-foreground hover:text-foreground"
                    onClick={handleForgotPassword}
                    disabled={loading}
                  >
                    Forgot password?
                  </Button>
                )}
              </div>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            {resetMessage && <p className="text-green-500 text-sm">{resetMessage}</p>} {/* Display reset message */}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
            {error === "Please check your email to confirm your account before signing in." && (
              <Button
                type="button"
                variant="link"
                className="w-full mt-2"
                onClick={handleResendConfirmation}
                disabled={loading}
              >
                Resend Confirmation Email
              </Button>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

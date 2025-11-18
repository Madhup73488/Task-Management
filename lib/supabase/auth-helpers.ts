import { supabase } from "./client";

// Set this to true to use mock authentication for development/testing
export const USE_MOCK_AUTH = false;

// Mock user data for development
export const MOCK_ADMIN_USER = {
  id: "32d5a9d1-9ee5-4911-87ac-fd39e0275750", // Use the actual ID from auth.users
  email: "mallikam8105@gmail.com",
  user_metadata: {
    role: "admin",
    full_name: "Mallika Admin",
    avatar: "/avatars/01.png" // Add a mock avatar for consistency
  },
  role: "admin", // Custom role from public.users
  // Add other necessary user properties if your app expects them
};

// 🟢 Sign in existing user
export async function signInWithEmail(email: string, password: string) {
  if (USE_MOCK_AUTH && email === MOCK_ADMIN_USER.email && password === "pass123") {
    console.log("Using mock sign-in for admin user.");
    // Simulate a successful sign-in by returning a mock session/user data
    return { user: MOCK_ADMIN_USER, session: { access_token: "mock_token", refresh_token: "mock_refresh" } };
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

// 🟢 Sign out current user
export async function signOut() {
  if (USE_MOCK_AUTH) {
    console.log("Using mock sign-out.");
    return; // Simulate successful sign-out
  }
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

// 🟢 Get the current logged-in user (client-side safe)
export async function getCurrentUser() {
  if (USE_MOCK_AUTH) {
    console.log("Using mock getCurrentUser for admin user.");
    return MOCK_ADMIN_USER;
  }

  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  if (sessionError) {
    console.error("Error getting session:", sessionError);
    return null;
  }

  if (!session) {
    return null;
  }

  // Refresh the session to ensure the latest user metadata is fetched
  const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();

  if (refreshError) {
    console.error("Error refreshing session:", refreshError);
    // Proceed with existing session if refresh fails
  }
  
  const currentSession = refreshedSession || session;

  if (!currentSession) {
    return null;
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(); // This will now use the refreshed session

  if (userError) {
    console.error("Error getting user:", userError);
    return null;
  }
  
  if (!user) {
    return null;
  }

  // Fetch the user's role from the public.users table
  const { data: userProfile, error: profileError } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError) {
    console.error("Error getting user profile:", profileError);
    return null;
  }

  // Combine the auth user object with the role from the public.users table
  return { ...user, role: userProfile.role };
}

// 🟢 Sign up a new user
export async function signUpNewUser(
  email: string,
  password: string,
  fullName: string,
  role: "admin" | "employee" = "employee"
) {
  // Mocking signup is not typically needed for this scenario, but can be added if required.
  if (USE_MOCK_AUTH) {
    console.log("Mock signup called, but not fully implemented. Proceeding with real signup.");
  }
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, role },
    },
  });

  if (error) throw error;

  // if email confirmation is required, there won’t be a session yet
  return data;
}

// 🟢 Resend confirmation email
export async function resendConfirmationEmail(email: string) {
  if (USE_MOCK_AUTH) {
    console.log("Mock resend confirmation email called.");
    return; // Simulate successful send
  }
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
  });
  if (error) throw error;
}

// 🟢 Send password reset email
export async function sendPasswordResetEmail(email: string, redirectTo?: string) {
  if (USE_MOCK_AUTH) {
    console.log("Mock send password reset email called.");
    // Simulate successful send, but no actual email will be sent.
    // The user will still need to manually "reset" their password in the DB or via dashboard.
    return; 
  }
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: redirectTo || `${window.location.origin}/auth/update-password`, // Default to a generic update-password page
  });
  if (error) throw error;
}

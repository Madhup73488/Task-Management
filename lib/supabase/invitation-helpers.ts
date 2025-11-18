import { supabase } from "./client";

export async function createInvitation(
  email: string,
  invitedBy: string,
  role: "admin" | "employee" = "employee"
) {
  // Check if invitation already exists
  const { data: existing } = await supabase
    .from("invitations")
    .select("*")
    .eq("email", email)
    .single();

  // If invitation exists and is pending, update it
  if (existing) {
    if (existing.status === "pending") {
      const { data, error } = await supabase
        .from("invitations")
        .update({
          invited_by: invitedBy,
          created_at: new Date().toISOString(),
        })
        .eq("email", email)
        .select();

      if (error) throw error;

      const signupUrl = `${
        window.location.origin
      }/auth/signup?email=${encodeURIComponent(email)}`;
      console.log(
        "Invitation updated! Share this URL with the user:",
        signupUrl
      );
      console.log(
        "User should sign up with email:",
        email,
        "and will have role:",
        role
      );

      return data;
    } else if (existing.status === "accepted") {
      throw new Error(
        "This user has already accepted an invitation and may already have an account."
      );
    }
  }

  // Create new invitation
  const { data, error } = await supabase
    .from("invitations")
    .insert([
      {
        email,
        invited_by: invitedBy,
        status: "pending",
      },
    ])
    .select();

  if (error) throw error;

  // In a real application, you would send an email here with the signup link
  // For now, we'll just log the invitation details
  const signupUrl = `${
    window.location.origin
  }/auth/signup?email=${encodeURIComponent(email)}`;
  console.log("Invitation created! Share this URL with the user:", signupUrl);
  console.log(
    "User should sign up with email:",
    email,
    "and will have role:",
    role
  );

  return data;
}

export async function acceptInvitation(email: string, userId: string) {
  const { data: invitation, error: fetchError } = await supabase
    .from("invitations")
    .select("*")
    .eq("email", email)
    .eq("status", "pending")
    .single();

  if (fetchError) throw fetchError;
  if (!invitation) throw new Error("Invitation not found or already accepted");

  // Mark invitation as accepted
  const { error: updateError } = await supabase
    .from("invitations")
    .update({ status: "accepted" })
    .eq("id", invitation.id);

  if (updateError) throw updateError;

  return invitation;
}

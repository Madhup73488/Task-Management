import { supabase } from "./client";
import { sendEmail } from "@/lib/brevo/emailService";

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
        role,
        status: "pending",
      },
    ])
    .select();

  if (error) throw error;

  // Send invitation email
  const signupUrl = `${
    process.env.NEXT_PUBLIC_BASE_URL
  }/auth/signup?email=${encodeURIComponent(email)}`;

  const subject = "You're invited to join Task Management System!";
  const htmlContent = `
    <p>Hello,</p>
    <p>You have been invited to join the Task Management System by Mallika M. Please click the link below to sign up and accept your invitation:</p>
    <p><a href="${signupUrl}">Accept Invitation and Sign Up</a></p>
    <p>Your role will be: <strong>${role}</strong></p>
    <p>If you did not expect this invitation, you can safely ignore this email.</p>
  `;

  const emailResult = await sendEmail({
    to: [{ email, name: email }], // Use email as name if full_name is not available
    subject,
    htmlContent,
    tags: ["invitation"],
  });

  if (!emailResult.success) {
    console.error("Failed to send invitation email:", emailResult.error);
    // Optionally, you might want to throw an error or handle this more gracefully
    // depending on whether a failed email send should prevent the invitation from being created in DB.
    // For now, we'll let the DB invitation creation succeed even if email fails.
  } else {
    console.log("Invitation email sent successfully to:", email);
  }

  return data;
}

export async function acceptInvitation(email: string, userId: string) {
  // Try to find a pending invitation
  const { data: invitations, error: fetchError } = await supabase
    .from("invitations")
    .select("*")
    .eq("email", email)
    .eq("status", "pending");

  // If there's an error fetching, throw it
  if (fetchError) throw fetchError;

  // If no pending invitation exists, that's okay - user might have already accepted or signed up without invitation
  if (!invitations || invitations.length === 0) {
    console.log("No pending invitation found for:", email);
    return null;
  }

  // Get the first pending invitation
  const invitation = invitations[0];

  // Mark invitation as accepted
  const { error: updateError } = await supabase
    .from("invitations")
    .update({ status: "accepted" })
    .eq("id", invitation.id);

  if (updateError) throw updateError;

  return invitation;
}

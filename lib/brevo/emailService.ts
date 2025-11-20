import fetch from 'node-fetch';

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

interface SendEmailParams {
  to: { email: string; name?: string }[];
  subject: string;
  htmlContent: string;
  sender?: { email: string; name?: string };
  replyTo?: { email: string; name?: string };
  cc?: { email: string; name?: string }[];
  bcc?: { email: string; name?: string }[];
  headers?: { [key: string]: string };
  params?: { [key: string]: any };
  tags?: string[];
}

export async function sendEmail({
  to,
  subject,
  htmlContent,
  sender, // Remove default here, will set below
  replyTo,
  cc,
  bcc,
  headers,
  params,
  tags,
}: SendEmailParams) {
  const apiKey = process.env.NEXT_PUBLIC_BREVO_API_KEY;
  const defaultSenderEmail = process.env.NEXT_PUBLIC_BREVO_SENDER_EMAIL || 'no-reply@yourdomain.com';
  const defaultSenderName = 'Task Management System';

  const finalSender = sender || { email: defaultSenderEmail, name: defaultSenderName };

  if (!apiKey) {
    console.error('BREVO_API_KEY is not defined in environment variables. Cannot send email.');
    return { success: false, message: 'Brevo API key not configured.' };
  }

  if (!finalSender.email) {
    console.error('Sender email is not defined. Cannot send email.');
    return { success: false, message: 'Sender email not configured.' };
  }

  console.log('Attempting to send email with Brevo API key:', apiKey ? 'Configured' : 'Not Configured');
  console.log('Using sender email:', finalSender.email);

  const emailData = {
    sender: finalSender,
    to,
    subject,
    htmlContent,
    replyTo,
    cc,
    bcc,
    headers,
    params,
    tags,
  };

  try {
    const response = await fetch(BREVO_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify(emailData),
    });

    const data = await response.json();

    if (response.ok) {
      console.log('Email sent successfully. Returned data: ' + JSON.stringify(data));
      return { success: true, data };
    } else {
      console.error('Error sending email:', data);
      return { success: false, error: data };
    }
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error };
  }
}

// Specific email functions for different use cases

export async function sendRegistrationConfirmationEmail(
  toEmail: string,
  toName: string,
  verificationLink: string
) {
  const subject = 'Welcome to Task Management System! Please confirm your email';
  const htmlContent = `
    <html>
      <head></head>
      <body>
        <p>Hello ${toName},</p>
        <p>Thank you for registering with Task Management System. Please click the link below to confirm your email address:</p>
        <p><a href="${verificationLink}">Confirm Email</a></p>
        <p>If you did not register for this service, please ignore this email.</p>
        <p>Best regards,</p>
        <p>The Task Management Team</p>
      </body>
    </html>
  `;
  return sendEmail({ to: [{ email: toEmail, name: toName }], subject, htmlContent, tags: ['registration'] });
}

export async function sendPasswordResetEmail(
  toEmail: string,
  toName: string,
  resetLink: string
) {
  const subject = 'Task Management System - Password Reset Request';
  const htmlContent = `
    <html>
      <head></head>
      <body>
        <p>Hello ${toName},</p>
        <p>You have requested to reset your password for your Task Management System account. Please click the link below to reset your password:</p>
        <p><a href="${resetLink}">Reset Password</a></p>
        <p>This link will expire in a short period. If you did not request a password reset, please ignore this email.</p>
        <p>Best regards,</p>
        <p>The Task Management Team</p>
      </body>
    </html>
  `;
  return sendEmail({ to: [{ email: toEmail, name: toName }], subject, htmlContent, tags: ['password-reset'] });
}

export async function sendTaskAssignmentNotification(
  toEmail: string,
  toName: string,
  taskTitle: string,
  taskLink: string,
  assignerName: string
) {
  const subject = `New Task Assigned: ${taskTitle}`;
  const htmlContent = `
    <html>
      <head></head>
      <body>
        <p>Hello ${toName},</p>
        <p>You have been assigned a new task by ${assignerName}: <strong>${taskTitle}</strong>.</p>
        <p>You can view the task details here: <a href="${taskLink}">View Task</a></p>
        <p>Best regards,</p>
        <p>The Task Management Team</p>
      </body>
    </html>
  `;
  return sendEmail({ to: [{ email: toEmail, name: toName }], subject, htmlContent, tags: ['task-assignment'] });
}

export async function sendAdminAlert(
  toEmail: string,
  alertSubject: string,
  alertMessage: string
) {
  const subject = `Admin Alert: ${alertSubject}`;
  const htmlContent = `
    <html>
      <head></head>
      <body>
        <p>Dear Admin,</p>
        <p>An important alert has been triggered in the Task Management System:</p>
        <p><strong>Subject:</strong> ${alertSubject}</p>
        <p><strong>Message:</strong> ${alertMessage}</p>
        <p>Please take appropriate action.</p>
        <p>Best regards,</p>
        <p>The Task Management System Automated Alert</p>
      </body>
    </html>
  `;
  return sendEmail({ to: [{ email: toEmail, name: 'Admin' }], subject, htmlContent, tags: ['admin-alert'] });
}

export async function sendMarketingEmail(
  toEmail: string,
  toName: string,
  campaignName: string,
  content: string
) {
  const subject = `Exciting News from Task Management System - ${campaignName}`;
  const htmlContent = `
    <html>
      <head></head>
      <body>
        <p>Hello ${toName},</p>
        ${content}
        <p>Best regards,</p>
        <p>The Task Management Team</p>
      </body>
    </html>
  `;
  return sendEmail({ to: [{ email: toEmail, name: toName }], subject, htmlContent, tags: ['marketing', campaignName] });
}

import { Resend } from "resend";
import Notification from "../models/Notification.js";

// ── Resend Setup ─────────────────────────────────────────────────────────
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * 🔹 DEPED FORMAL LETTER WRAPPER
 * Creates a government-standard document layout for emails.
 */
const formalLetterWrapper = (content, subjectCode = "RSP-2026") => `
  <div style="background-color: #f4f4f4; padding: 40px 20px; font-family: 'Times New Roman', serif;">
    <div style="max-width: 700px; margin: 0 auto; background-color: #ffffff; padding: 60px; border: 1px solid #ddd; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
      
      <!-- Letterhead -->
      <div style="text-align: center; border-bottom: 2px solid #1d4ed8; padding-bottom: 20px; margin-bottom: 40px;">
        <p style="margin: 0; font-size: 12px; text-transform: uppercase;">Republic of the Philippines</p>
        <p style="margin: 0; font-size: 16px; font-weight: bold; color: #1d4ed8;">Department of Education</p>
        <p style="margin: 0; font-size: 12px;">National Capital Region</p>
        <p style="margin: 5px 0 0 0; font-size: 11px; font-style: italic; color: #64748b;">Schools Division Office</p>
      </div>

      <!-- Date & Ref -->
      <div style="margin-bottom: 30px;">
        <p style="margin: 0; font-size: 14px;">${new Date().toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
        <p style="margin: 5px 0 0 0; font-size: 12px; color: #94a3b8; font-weight: bold;">Ref No: ${subjectCode}</p>
      </div>

      <!-- Body -->
      <div style="font-size: 15px; color: #1e293b; line-height: 1.8; text-align: justify;">
        ${content}
      </div>

      <!-- Closing -->
      <div style="margin-top: 60px;">
        <p style="margin: 0;">Very truly yours,</p>
        <div style="margin-top: 40px;">
          <p style="margin: 0; font-weight: bold; text-transform: uppercase; border-bottom: 1px solid #000; display: inline-block;">THE PBAC CHAIRPERSON</p>
          <p style="margin: 0; font-size: 12px; color: #64748b;">Personnel Selection Board</p>
        </div>
      </div>

      <!-- Footer Branding -->
      <div style="margin-top: 80px; padding-top: 20px; border-top: 1px solid #f1f5f9; text-align: center;">
        <p style="font-size: 10px; color: #94a3b8; margin: 0; text-transform: uppercase; letter-spacing: 1px;">This is an officially generated electronic communication from the DepEd RSP Portal.</p>
      </div>
    </div>
  </div>
`;

export const sendEmail = async ({ email, subject, html, notificationId, isFormal = false }) => {
  try {
    const finalHtml = isFormal ? formalLetterWrapper(html) : html;
    
    const { data, error } = await resend.emails.send({
      from: 'DepEd Recruitment <onboarding@resend.dev>', // Replace with your verified domain in production
      to: email,
      subject,
      html: finalHtml,
    });

    if (error) {
      throw new Error(error.message);
    }

    if (notificationId) {
      await Notification.findByIdAndUpdate(notificationId, { emailSent: true });
    }
    return data;
  } catch (error) {
    if (notificationId) {
      await Notification.findByIdAndUpdate(notificationId, { emailError: error.message });
    }
    console.error("❌ Resend Email Error:", error.message);
    throw error;
  }
};

/**
 * ── Specialized Notification Triggers ──────────────────────────────────
 */
export const notifyStatusUpdate = async ({ user, application, oldStatus, newStatus, jobTitle, reason }) => {
  const statusLabels = {
    applied: "Application Received",
    verifying: "Under Documents Verification",
    comparative_assessment: "Qualified for Next Stage",
    ranked: "Ranked in Registry (RQA)",
    disqualified: "Notice of Disqualification",
  };

  const title = `Status Update: ${statusLabels[newStatus] || newStatus}`;
  const message = `Your application for ${jobTitle} has moved to: ${statusLabels[newStatus] || newStatus}.`;

  const notification = await Notification.create({
    recipient: user._id,
    application: application._id,
    title,
    message,
    type: "status_update",
    metadata: { oldStatus, newStatus, jobTitle }
  });

  let formalContent = "";
  let isFormal = false;

  // ── QUALIFIED LETTER ───────────────────────────────────────────────────
  if (newStatus === "comparative_assessment") {
    isFormal = true;
    formalContent = `
      <p>Dear <strong>Mr./Ms. ${user.name?.lastName || user.username}</strong>,</p>
      <p>Following the Initial Evaluation of your application for the position of <strong>${jobTitle}</strong>, we are pleased to inform you that you have met the minimum Qualification Standards (QS) set for the position.</p>
      <p>In view thereof, you are hereby invited to proceed to the next stage of the recruitment process, which includes the <strong>Behavioral Event Interview (BEI)</strong> and, if applicable, the <strong>Work Sample Test</strong> or <strong>Demonstration Teaching</strong>.</p>
      <p>Please wait for a subsequent notification regarding the specific schedule, venue, and further instructions for these assessments.</p>
      <p>Congratulations and we look forward to your participation.</p>
    `;
  } 
  
  // ── DISQUALIFIED LETTER ────────────────────────────────────────────────
  else if (newStatus === "disqualified") {
    isFormal = true;
    formalContent = `
      <p>Dear <strong>Mr./Ms. ${user.name?.lastName || user.username}</strong>,</p>
      <p>Thank you for your interest in applying for the position of <strong>${jobTitle}</strong> in the Department of Education.</p>
      <p>We regret to inform you that after a thorough review of your submitted documents and verification of your qualifications, we are unable to proceed with your application at this time for the following reason(s):</p>
      <div style="background-color: #fffaf0; padding: 15px; border: 1px dashed #f6ad55; margin: 20px 0; font-weight: bold; color: #c05621;">
        ${reason || "Does not meet the specific Qualification Standards (QS) required for the position."}
      </div>
      <p>While this may be disappointing, please be assured that your information will remain in our database for future vacancies that may better match your profile.</p>
      <p>We appreciate the time and effort you have invested in this process and wish you the best in your professional endeavors.</p>
    `;
  }

  if (isFormal) {
    // Enable email for formal status updates (Qualification/Disqualification)
    await sendEmail({ 
      email: user.email, 
      subject: `[OFFICIAL] ${statusLabels[newStatus]} - ${jobTitle}`, 
      html: formalContent, 
      notificationId: notification._id,
      isFormal: true
    }).catch(err => console.error(`Failed to send formal email to ${user.email}:`, err.message));
  } else {
    // Standard informal update for other statuses
    const informalHtml = `
      <div style="font-family: sans-serif; padding: 20px; color: #1e293b;">
        <h2 style="color: #1d4ed8;">Application Update</h2>
        <p>Dear ${user.name?.firstName || user.username},</p>
        <p>Your application for <strong>${jobTitle}</strong> has been updated to: <span style="font-weight: bold; color: #1d4ed8;">${statusLabels[newStatus] || newStatus}</span>.</p>
        <p>Please log in to your dashboard to view more details and track your application journey.</p>
        <br/>
        <p style="font-size: 12px; color: #64748b;">This is an automated notification. Please do not reply to this email.</p>
      </div>
    `;
    await sendEmail({ 
      email: user.email, 
      subject: `[UPDATE] ${title}`, 
      html: informalHtml, 
      notificationId: notification._id 
    }).catch(err => console.error(`Failed to send status email to ${user.email}:`, err.message));
  }
};

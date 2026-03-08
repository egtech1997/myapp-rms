import BulkCommunication from "../models/BulkCommunication.js";
import Notification from "../models/Notification.js";
import { sendEmail } from "./email.service.js";
import Application from "../models/Application.js";

/**
 * 🔹 ASYNC BULK SENDING SERVICE
 * Handles large recipient lists in batches to avoid SMTP throttling and memory issues.
 */
export const processBulkSend = async (bulkCommId) => {
  const bulk = await BulkCommunication.findById(bulkCommId).populate("recipients.user");
  if (!bulk) return;

  const { subject, content, type, recipients } = bulk;

  for (let i = 0; i < recipients.length; i++) {
    const recipient = recipients[i];
    const user = recipient.user;

    try {
      // 1. Send In-App Notification if requested
      if (type === "in_app" || type === "both") {
        await Notification.create({
          recipient: user._id,
          application: recipient.application,
          title: subject,
          message: content,
          type: "general"
        });
      }

      // 2. Send Email if requested
      if (type === "email" || type === "both") {
        await sendEmail({
          email: user.email,
          subject: subject,
          html: `<div style="font-family: sans-serif; line-height: 1.6;">${content.replace(/\n/g, '<br>')}</div>`
        });
      }

      // Update success
      recipient.status = "success";
      recipient.sentAt = new Date();
      bulk.stats.success += 1;

    } catch (err) {
      console.error(`❌ Bulk send failed for ${user.email}:`, err.message);
      recipient.status = "failed";
      recipient.error = err.message;
      bulk.stats.failed += 1;
    }

    // Save progress periodically or at the end
    if (i % 10 === 0 || i === recipients.length - 1) {
      await bulk.save();
    }
  }
};

export default { processBulkSend };

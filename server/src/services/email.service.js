import nodemailer from "nodemailer";

const sendEmail = async ({ email, subject, html }) => {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    // Use 2525 in .env if 587 is being blocked by your firewall/ISP
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false, // Must be false for port 587 or 2525
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    // The TLS block is crucial for bypassing local connection restrictions
    tls: {
      rejectUnauthorized: false,
      minVersion: "TLSv1.2",
    },
  });

  try {
    const info = await transporter.sendMail({
      from: '"App Security" <rsp.primehr@deped.gov.ph>',
      to: email,
      subject,
      html,
    });
    console.log("📧 Email sent: %s", info.messageId);
    return info;
  } catch (error) {
    console.error("❌ Mailer Error:", error.message);
    // Rethrow so your controller can notify the user
    throw new Error(`Email delivery failed: ${error.message}`);
  }
};

export default sendEmail;

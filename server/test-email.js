import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

console.log("🔍 Testing SMTP connection...");
console.log(`Host: ${process.env.SMTP_HOST}`);
console.log(`Port: ${process.env.SMTP_PORT}`);
console.log(`User: ${process.env.SMTP_USER}`);

transporter.verify((error, success) => {
  if (error) {
    console.error("❌ SMTP Connection Error:", error.message);
    process.exit(1);
  } else {
    console.log("✅ SMTP Server is ready for emails");
    
    // Try sending a real test email
    const mailOptions = {
      from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_USER}>`,
      to: process.env.SMTP_USER, // Send to self
      subject: "SMTP Test Email",
      text: "If you are reading this, your SMTP settings are working!",
      html: "<b>If you are reading this, your SMTP settings are working!</b>",
    };

    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.error("❌ Send Mail Error:", err.message);
      } else {
        console.log("📧 Test email sent successfully:", info.response);
      }
      process.exit(0);
    });
  }
});

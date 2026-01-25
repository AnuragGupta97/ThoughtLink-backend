const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,        // use 587 (more reliable than 465 on cloud)
  secure: false,   // STARTTLS
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // Gmail App Password
  },
  tls: {
    rejectUnauthorized: false,
  },
  connectionTimeout: 15000,
});

async function sendOtpEmail(toEmail, otp) {
  try {
    await transporter.sendMail({
      from: `"My App" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: "Your OTP Verification Code",
      html: `
        <h2>Email Verification</h2>
        <p>Your OTP is:</p>
        <h1>${otp}</h1>
        <p>This OTP will expire in 5 minutes.</p>
      `,
    });

    console.log("OTP email sent");
  } catch (error) {
    console.error("EMAIL ERROR:", error);
    throw error;
  }
}

module.exports = sendOtpEmail;

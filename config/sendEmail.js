const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.BREVO_SMTP_USER,
    pass: process.env.BREVO_SMTP_PASS,
  },
});

async function sendOtpEmail(toEmail, otp) {
  try {
    await transporter.sendMail({
      from: `"My App" <anurag1922004@gmail.com>`, // verified sender
      to: toEmail,
      subject: "Your OTP Verification Code",
      html: `
        <h2>Email Verification</h2>
        <h1>${otp}</h1>
        <p>This OTP will expire in 5 minutes.</p>
      `,
    });

    console.log("OTP sent via Brevo SMTP");
  } catch (err) {
    console.error("BREVO MAIL ERROR:", err);
  }
}

module.exports = sendOtpEmail;

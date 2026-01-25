const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendOtpEmail(toEmail, otp) {
  try {
    await resend.emails.send({
      from: "My App <onboarding@resend.dev>",
      to: toEmail,
      subject: "Your OTP Verification Code",
      html: `
        <h2>Email Verification</h2>
        <p>Your OTP is:</p>
        <h1>${otp}</h1>
        <p>This OTP will expire in 5 minutes.</p>
      `,
    });

    console.log("OTP sent via Resend");
  } catch (error) {
    console.error("Resend error:", error);
    throw error;
  }
}

module.exports = sendOtpEmail;
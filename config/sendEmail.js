const axios = require("axios");

async function sendOtpEmail(toEmail, otp) {
  try {
    await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: {
          name: "My App",
          email: "anurag1922004@gmail.com", // MUST be verified in Brevo
        },
        to: [
          { email: toEmail }
        ],
        subject: "Your OTP Verification Code",
        htmlContent: `
          <h2>Email Verification</h2>
          <h1>${otp}</h1>
          <p>This OTP will expire in 5 minutes.</p>
        `,
      },
      {
        headers: {
          "api-key": process.env.BREVO_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("OTP sent via Brevo API ✅");
  } catch (err) {
    console.error(
      "BREVO API ERROR ❌",
      err.response?.data || err.message
    );
  }
}

module.exports = sendOtpEmail;

const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

async function sendOtpEmail(toEmail, otp) {
    await transporter.sendMail({
        from: `"My App" <${process.env.EMAIL_USER}>`,
        to: toEmail,
        subject: "Your OTP Verification Code",
        html: `
            <h2>Email Verification</h2>
            <p>Your OTP is:</p>
            <h1>${otp}</h1>
            <p>This OTP will expire in 5 minutes.</p>
        `
    });
}

module.exports = sendOtpEmail;
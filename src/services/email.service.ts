import nodemailer from "nodemailer";

// Create the SMTP transporter once (reused across all calls)
const transporter = nodemailer.createTransport({
    host: "smtp.resend.com",
    port: 587,
    secure: false,
    auth: {
        user: "resend",
        pass: process.env.RESEND_API_KEY!,
    },
});

const SENDER_EMAIL = process.env.SENDER_EMAIL || "onboarding@resend.dev";

export async function sendEmail(
    to: string,
    subject: string,
    body: string
) {
    try {
        const info = await transporter.sendMail({
            from: `"Shiksha Intelligence" <${SENDER_EMAIL}>`,
            to,
            subject,
            text: body,
            html: `<p>${body}</p>`,
        });

        console.log("📧 EMAIL SENT");
        console.log("To:", to);
        console.log("Subject:", subject);
        console.log("Message ID:", info.messageId);
    } catch (error) {
        console.error("❌ EMAIL FAILED for:", to);
        console.error("Error:", error);
        throw error; // re-throw so the worker knows it failed and doesn't delete the SQS message
    }
}
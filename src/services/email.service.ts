export async function sendEmail(
    to: string,
    subject: string,
    body: string
) {
    console.log("📧 EMAIL SENT");
    console.log("To:", to);
    console.log("Subject:", subject);
    console.log("Body:", body);

    // later:
    // nodemailer
    // SES
    // Sendgrid
}
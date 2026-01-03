export class EmailService {
    static async sendVerificationEmail(email: string, code: string) {
        // TODO: In production, integrate with Resend, SendGrid, or Nodemailer (SMTP)
        // For now, we simulate sending by logging the code.
        console.error(`
        ****************************************
        [EMAIL MOCK] Sending to: ${email}
        Subject: Verify your Buzz account
        
        Your verification code is: ${code}
        ****************************************
        `);
        return true;
    }
}

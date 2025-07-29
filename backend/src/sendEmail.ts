//backend/src/utils/email.ts
//Helper for sending emails (e.g., using nodemailer).
//Keeps email logic reusable and separate from 2FA logic.

//Use nodemailer (or similar) to send emails.
//Export a function, e.g. sendEmail(to, subject, text).
import nodemailer from "nodemailer";

export async function sendEmail(to: string, subject: string, text: string) {
	// ========================================
	// 📧 MODE DÉVELOPPEMENT : AFFICHAGE LOGS
	// ========================================
	console.log("");
	console.log("🔐 ========== CODE 2FA ==========");
	console.log(`📧 Destinataire: ${to}`);
	console.log(`📝 Sujet: ${subject}`);
	console.log(`💬 Message: ${text}`);
	console.log("🔐 ================================");
	console.log("");

	// Simulation d'un délai d'envoi
	await new Promise((resolve) => setTimeout(resolve, 100));

	/* 
  // ========================================
  // 📬 MODE PRODUCTION : ENVOI EMAIL RÉEL
  // ========================================
  // Décommentez ce bloc quand la config Gmail est prête
  
  const transporter = nodemailer.createTransport({
    service: 'gmail', // or other email provider
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject,
    text,
  });
  */
}

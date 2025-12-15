const nodemailer = require("nodemailer");

// Create reusable transporter object using the default SMTP transport
// For development, we can use Ethereal or just log to console if no env vars
// Create reusable transporter object using valid SMTP transport
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  // Vercel / Serverless Optimization
  pool: true, // Use pooled connections
  maxConnections: 1, // Limit connections to avoid overwhelming server or hitting limits
  rateLimit: 5, // Rate limit
  // Timeouts to prevent hanging
  connectionTimeout: 10000, // 10 seconds
  greetingTimeout: 5000,    // 5 seconds
  socketTimeout: 10000,     // 10 seconds
  debug: true, // Show debug output
  logger: true // Log information to console
});

/**
 * Send generic email
 */
async function sendEmail(to, subject, html) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log(`[MOCK EMAIL] To: ${to}, Subject: ${subject}`);
    return;
  }

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"Capstone System" <no-reply@example.com>',
      to,
      subject,
      html,
    });
    console.log("Message sent: %s", info.messageId);
  } catch (error) {
    console.error("Error sending email:", error);
  }
}

/**
 * Send Team Registration Email
 */
async function sendTeamRegistrationEmail(emails, groupName) {
  const subject = `Pendaftaran Tim Berhasil: ${groupName}`;
  const html = `
    <h3>Pendaftaran Tim Berhasil</h3>
    <p>Halo,</p>
    <p>Tim Anda <b>${groupName}</b> telah berhasil didaftarkan dan sedang menunggu validasi dari admin.</p>
    <p>Terima kasih.</p>
  `;
  
  // Send to all members
  for (const email of emails) {
    await sendEmail(email, subject, html);
  }
}

/**
 * Send Team Validation Email
 */
async function sendTeamValidationEmail(emails, groupName, status, reason) {
  const subject = status === "accepted" 
    ? `Tim Diterima: ${groupName}` 
    : `Tim Ditolak: ${groupName}`;
    
  const html = status === "accepted"
    ? `
      <h3>Selamat!</h3>
      <p>Tim Anda <b>${groupName}</b> telah <b>DITERIMA</b>.</p>
      <p>Silakan lanjutkan ke tahap berikutnya.</p>
    `
    : `
      <h3>Mohon Maaf</h3>
      <p>Tim Anda <b>${groupName}</b> telah <b>DITOLAK</b>.</p>
      <p>Alasan: ${reason || "Tidak memenuhi kriteria."}</p>
      <p>Silakan perbaiki dan daftar kembali.</p>
    `;

  for (const email of emails) {
    await sendEmail(email, subject, html);
  }
}

/**
 * Send Worksheet Reminder Email
 */
async function sendWorksheetReminderEmail(emails, periodTitle, endDate) {
  const subject = `Pengingat: Batas Waktu Worksheet ${periodTitle}`;
  const html = `
    <h3>Halo!</h3>
    <p>Ini adalah pengingat untuk segera mengisi <b>${periodTitle}</b>.</p>
    <p>Batas waktu pengumpulan adalah: <b>${endDate}</b></p>
    <p>Mohon segera selesaikan sebelum tenggat waktu.</p>
    <p>Terima kasih.</p>
  `;

  for (const email of emails) {
    await sendEmail(email, subject, html);
  }
}

module.exports = {
  sendEmail,
  sendTeamRegistrationEmail,
  sendTeamValidationEmail,
  sendWorksheetReminderEmail,
};
